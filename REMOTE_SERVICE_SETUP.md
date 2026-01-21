# Remote HTTP Service & Obsidian Plugin Setup

This document explains how to configure the **obsidian-latex-pdf** HTTP service and the **Obsidian plugin** so that notes are rendered to PDF via the remote backend.

It covers:

- Server configuration (JWT secret, HTTPS, templates)
- Obtaining the service URL
- Generating JWT tokens
- Plugin configuration for the remote backend

---

## 0. Quick map: what happens where?

To avoid confusion, here’s where each set of steps runs:

- **On your local machine (terminal, inside this repo)**
  - Editing TypeScript / CDK files in `obsidian-latex-pdf/` and `obsidian-latex-pdf/cdk/`.
  - Running commands like `npm run build`, `npm run deploy`, `aws cloudformation ...`.
  - Generating JWT tokens with `node`.

- **In the AWS Console**
  - Requesting ACM certificates in **Certificate Manager**.
  - Setting up DNS records in **Route 53** (or external DNS provider) to point to the ALB.
  - Optionally checking ECS/ALB/S3 status.

- **In Obsidian (UI)**
  - Enabling the plugin.
  - Configuring plugin settings (backend, base URL, JWT token, default template).
  - Running “Export to LaTeX PDF” commands.

- **In the Docker image**
  - LaTeX templates must live at `/templates/<templateId>.tex`.

Keep this mental map in mind while following the steps below.

---

## 1. Server configuration

### 1.1 Prerequisites

**Where:**

- Local machine, inside `obsidian-latex-pdf/`
- AWS account `989646093931`, region `eu-west-1`

You should already have:

- An ECS Fargate service + ALB deployed by the CDK stack `ObsidianLatexPdfStack` (from `cdk/`).
- A Docker image published to GHCR, e.g.: `ghcr.io/antonbakker/obsidian-latex-pdf:<tag>`.

The CDK app lives in `obsidian-latex-pdf/cdk/` and deploys:

- An S3 input bucket
- An ECS Fargate service running the HTTP API
- An Application Load Balancer (ALB)


### 1.2 Ensure templates exist in the container

**Where:**

- Local machine (editing this repo)
- Docker image build context

The HTTP API supports `templateId` via the `options` field on `/render-json` and `/render-from-s3`.

The renderer expects LaTeX templates at:

- `/templates/<templateId>.tex`

For example, if the plugin uses `template.id = "kaobook"`, the image must contain:

- `/templates/kaobook.tex`

Adjust your `Dockerfile` (at the root of this repo) to copy templates into the image in a way that matches how the renderer looks them up.

The renderer expects files at:

- `/templates/<templateId>.tex`

The current repo uses this pattern on disk:

- `templates/<templateId>/template.tex`

So the **correct** Dockerfile configuration is to copy each `template.tex` to `/templates/<templateId>.tex`, for example:

```dockerfile path=/Users/anton/Development/989646093931/obsidian-latex-pdf/Dockerfile start=18
# Copy templates from repo layout to the locations expected by the renderer
COPY templates/article/template.tex         /templates/article.tex
COPY templates/business-plan/template.tex   /templates/business-plan.tex
COPY templates/common/template.tex          /templates/common.tex
COPY templates/ieee-proposal/template.tex   /templates/ieee-proposal.tex
COPY templates/kaobook/template.tex         /templates/kaobook.tex
COPY templates/koma-proposal/template.tex   /templates/koma-proposal.tex
COPY templates/letter/template.tex          /templates/letter.tex
COPY templates/memo/template.tex            /templates/memo.tex
COPY templates/report/template.tex          /templates/report.tex
COPY templates/thesis-kaobook/template.tex  /templates/thesis-kaobook.tex
```

> **Note:** A generic `COPY templates /templates` would put files at `/templates/<templateId>/template.tex`, which does **not** match what the renderer expects. Use the explicit mapping above, and when you add new templates:
>
> - Create `templates/<new-id>/template.tex` in the repo.
> - Add a corresponding `COPY templates/<new-id>/template.tex /templates/<new-id>.tex` line to the `Dockerfile`.

Rebuild and publish the image via your GitHub Actions workflow (or manually) as usual.


### 1.3 Create a strong JWT secret

The service uses `JWT_SECRET` for HS256 JWT verification.

**Where:**

- Local machine (terminal)

Generate a random secret (run once and keep safe):

```bash path=null start=null
openssl rand -base64 32
```

Call the value `{{JWT_SECRET}}` (do not commit it).

This secret will be:

- Set as an environment variable on the ECS task (`JWT_SECRET`).
- Used to generate JWT tokens for the plugin.


### 1.4 Configure `JWT_SECRET` in the CDK stack

**Where:**

- Local machine (editing `obsidian-latex-pdf/cdk/lib/obsidian-latex-pdf-stack.ts`)
- Then local terminal (running `npm run deploy` from `cdk/`)

> **Important:** ECS task environment variables are **read‑only** once a task definition
> revision is created. You do **not** edit them in the AWS Console on an existing
> revision. Instead, you:
>
> 1. Update the environment mapping in CDK (`taskImageOptions.environment`).
> 2. Run `cdk deploy` again.
> 3. CDK creates a **new task definition revision** with the new env values and
>    updates the service to use it.
>
> The `JWT_SECRET` value you export in your local shell is baked into that new
> task definition revision.

1. Open `cdk/lib/obsidian-latex-pdf-stack.ts` and locate the `ApplicationLoadBalancedFargateService` definition.
2. In its `taskImageOptions.environment`, ensure it includes:

```ts path=/Users/anton/Development/989646093931/obsidian-latex-pdf/cdk/lib/obsidian-latex-pdf-stack.ts start=null
taskImageOptions: {
  image: ecs.ContainerImage.fromRegistry(`${props.imageName}:${props.imageTag}`),
  containerPort: 8080,
  environment: {
    INPUT_BUCKET_NAME: inputBucket.bucketName,
    JSON_MAX_BYTES: '1048576',
    MULTIPART_MAX_BYTES: '10485760',
    S3_OBJECT_MAX_BYTES: '104857600',
    LATEX_ENGINE: 'xelatex',
    JWT_SECRET: process.env.JWT_SECRET ?? '',
  },
},
```

Then deploy with `JWT_SECRET` in your environment:

**Where:**

- Local terminal, inside `obsidian-latex-pdf/cdk`
- Assumes `AWS_PROFILE` is already configured to use account `989646093931` in region `eu-west-1`.

```bash path=null start=null
cd cdk

export AWS_PROFILE=BeyondAmbition         # or your actual profile name
export AWS_REGION=eu-west-1
export AWS_ACCOUNT_ID=989646093931

export JWT_SECRET={{JWT_SECRET}}
export GHCR_OWNER=antonbakker

npm run deploy
```

Notes:

- If `JWT_SECRET` is **set and non-empty**, the service enforces JWT auth on:
  - `POST /render-json`
  - `POST /render-upload`
  - `POST /init-upload`
  - `POST /render-from-s3`
- Health endpoints (`/health`, `/`) remain public.


### 1.5 Enable HTTPS on the ALB (optional but recommended)

**Where:**

- AWS Console (ACM + Route 53)
- Local terminal (deploying with `SERVICE_DOMAIN` / `SERVICE_SUBDOMAIN`)

> **Note on domains:** `pdf.example.com` below is a **placeholder**. You must
> use a real domain name that you control, typically managed in Route 53. For
> example, if you own `example.com`, you might choose `latex.example.com` or
> `pdf.example.com` as the subdomain for this service.

#### 1.5.1 Request ACM certificate for your actual domain

1. In the AWS Console, in the **eu-west-1** region:
   - Open **Certificate Manager (ACM)**.
   - Click **Request certificate → Request a public certificate**.
   - For **Fully qualified domain name**, enter the **actual subdomain** you
     want to use, e.g. `latex.example.com`.
   - Choose **DNS validation**.
   - Submit the request.

2. On the certificate details page, ACM will show the required DNS validation
   record(s). If your domain is in Route 53, you can usually click
   **“Create records in Route 53”** to add them automatically. Otherwise,
   manually create the CNAME record in your external DNS provider.

3. Wait until the certificate status becomes **Issued**.

4. You do **not** need to manually copy the certificate ARN anymore. The CDK
   stack will create and manage the ACM certificate automatically when
   `SERVICE_DOMAIN` and `SERVICE_SUBDOMAIN` are set.

2. The CDK app already accepts an ACM ARN via `ALB_CERT_ARN` (see `cdk/bin/app.ts`):

   ```ts path=/Users/anton/Development/989646093931/obsidian-latex-pdf/cdk/bin/app.ts start=null
   const certificateArn = process.env.ALB_CERT_ARN;
   ```

   and adds a 443 listener when provided.

3. Redeploy with domain configuration (CDK will then create the ACM certificate
   and DNS record automatically):

   **Where:**

   - Local terminal, inside `obsidian-latex-pdf/cdk`

   ```bash path=null start=null
   cd cdk

   export AWS_PROFILE=BeyondAmbition
   export AWS_REGION=eu-west-1
   export AWS_ACCOUNT_ID=989646093931

   export JWT_SECRET={{JWT_SECRET}}
   export GHCR_OWNER=antonbakker

   # Domain configuration for CDK-driven HTTPS/DNS wiring
   export SERVICE_DOMAIN=example.com          # your real root domain
   export SERVICE_SUBDOMAIN=latex             # your chosen subdomain

   npm run deploy
   ```

4. Point DNS to the ALB:

   **Where:**

   - AWS Console → Route 53 (hosted zone for your domain)

   Steps (assuming your domain is hosted in Route 53):

   1. Go to **Route 53 → Hosted zones** and open the hosted zone for
      your root domain (e.g. `example.com`).
   2. Click **Create record**.
   3. Choose **Record name** = the subdomain you used in ACM, e.g.
      `latex` if your full name is `latex.example.com`.
   4. Set **Record type** = `A`.
   5. Set **Alias** = **Yes**.
   6. For **Route traffic to**, choose **Alias to Application and Classic Load Balancer**.
   7. Select the region `eu-west-1` and then select your ALB from the list
      (its DNS name will look like `Obsidi-Servi-xxxx.eu-west-1.elb.amazonaws.com`).
   8. Save the record.

   If your DNS is **not** in Route 53, you can instead create a **CNAME**
   record at your DNS provider pointing `latex.example.com` to the ALB DNS
   name.

Your service base URL will then be your actual subdomain, e.g.:

- `https://latex.example.com`


### 1.6 Obtaining the service URL

You can get the service URL via:

- **CDK deploy output** (terminal): look for an output named like `ObsidianLatexPdfStack.ServiceServiceURL...`.
- **AWS CLI** (terminal):

```bash path=null start=null
aws cloudformation describe-stacks \
  --stack-name ObsidianLatexPdfStack \
  --query "Stacks[0].Outputs[?starts_with(OutputKey, 'ServiceServiceURL')].OutputValue" \
  --output text
```

If you configured `SERVICE_DOMAIN` / `SERVICE_SUBDOMAIN` and have a hosted zone
for that domain in Route 53, CDK will:

- Create/manage an ACM certificate for `SERVICE_SUBDOMAIN.SERVICE_DOMAIN`.
- Add an HTTPS listener on the ALB.
- Create/update an A/alias record pointing the subdomain to the ALB.

Your effective base URL is then:

- `https://latex.example.com`

---

## 2. Generating a JWT token for the plugin

The plugin needs a Bearer token that matches `JWT_SECRET` on the server.

**Where:**

- Local machine, inside `obsidian-latex-pdf/`

Use Node + `jsonwebtoken` (installed in the project) to generate a token:

```bash path=null start=null
cd obsidian-latex-pdf

export JWT_SECRET={{JWT_SECRET}}

node - <<'EOF'
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET must be set in the environment');
  process.exit(1);
}

const payload = {
  sub: 'obsidian-plugin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // valid for 1 hour
};

const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
console.log(token);
EOF
```

Copy the printed token (`eyJhbGciOiJI...`) and use it in the plugin’s **Remote service JWT token** field.

You can later adjust the expiry time or regenerate the token as needed.

---

## 3. Plugin configuration (Obsidian)

### 3.1 Build/install the plugin

**Where:**

- Local machine (terminal + Obsidian UI)

From the project root (`obsidian-latex-pdf/`):

```bash path=null start=null
npm install
npm run build
```

Then place or link the built plugin into Obsidian’s plugin folder as you normally do for development, for example:

- On macOS, the vault plugins folder is typically under:
  - `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/<vault>/.obsidian/plugins/`

Copy the build output there (following the structure used by Obsidian’s community plugins), then:

- In Obsidian, go to **Settings → Community plugins → Installed plugins**, and enable **Obsidian LaTeX PDF**.


### 3.2 Choose the remote backend

In Obsidian (UI):

1. Open **Settings → Community Plugins → Obsidian LaTeX PDF**.
2. In the plugin’s settings tab:
   - Set **Export backend** to `Remote HTTP service`.

This sets `exportBackend = "service"` in the plugin’s settings.


### 3.3 Configure the remote service base URL

In the same settings tab (Obsidian UI):

- Set **Remote service base URL** to your API base, e.g.:
  - `https://pdf.example.com` (recommended)
  - Or the raw ALB URL if needed: `https://Obsidi-Servi-xxxx.eu-west-1.elb.amazonaws.com`

No trailing slash is required; the plugin normalizes the URL.


### 3.4 Configure the JWT token

Still in the plugin settings (Obsidian UI):

- Set **Remote service JWT token** to the JWT you generated.

The plugin will send:

```http
Authorization: Bearer <your_token>
```

on calls to:

- `POST /render-json`
- `POST /init-upload`
- `POST /render-from-s3`

If `JWT_SECRET` is not set on the server, the token is not required, but for secure setups it should be used.


### 3.5 Configure templates

The plugin’s **Default template** corresponds to a `template.id` from its internal `templateRegistry`.

**Where to configure:**

- Obsidian UI → plugin settings → **Default template** dropdown.

The remote service expects a matching template file:

- `template.id = "kaobook"` → `/templates/kaobook.tex` inside the container

During export, the plugin sends:

```json
"options": { "templateId": "<template.id>" }
```

The HTTP service passes `templateId` into Pandoc as:

```text
--template /templates/<templateId>.tex
```

Ensure your container has templates that match the IDs you use in Obsidian.

---

## 4. Runtime behavior

### 4.1 Small/medium notes (≤ 1 MB)

When you export a note via the remote backend:

1. The plugin reads the note content and computes its UTF‑8 size.
2. If `sizeBytes <= 1 MB` (approx):
   - It calls:

     ```http
     POST {baseUrl}/render-json
     Authorization: Bearer <token> (if configured)
     Content-Type: application/json

     {
       "content": "...markdown...",
       "format": "markdown",
       "output": "pdf",
       "options": { "templateId": "<template.id>" }
     }
     ```

3. The service renders the PDF directly and returns it as the HTTP response body.
4. The plugin writes the PDF next to the note in your vault (same folder, same basename + `.pdf`).


### 4.2 Large notes (> 1 MB)

If `sizeBytes > 1 MB`:

1. The plugin calls:

   ```http
   POST {baseUrl}/init-upload
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "fileName": "<note-basename>.md",
     "contentType": "text/markdown; charset=utf-8",
     "expectedSizeBytes": <sizeBytes>
   }
   ```

2. The service responds with (among others):

   ```json
   {
     "uploadUrl": "<presigned-s3-url>",
     "objectKey": "uploads/....md",
     "expiresInSeconds": 900,
     "maxSizeBytes": 104857600,
     "bucket": "<input-bucket-name>"
   }
   ```

3. The plugin uploads the markdown directly to S3 using the `uploadUrl`:

   ```http
   PUT <uploadUrl>
   Content-Type: text/markdown; charset=utf-8

   <raw markdown content>
   ```

4. After the upload, the plugin calls:

   ```http
   POST {baseUrl}/render-from-s3
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "bucket": "<bucket>",
     "key": "<objectKey>",
     "format": "markdown",
     "output": "pdf",
     "options": { "templateId": "<template.id>" }
   }
   ```

5. The service fetches the object from S3, renders the PDF, and returns it.
6. The plugin writes the PDF next to the note in your vault.

---

## 5. Quick verification steps

1. **Check service health** (no JWT needed):

   **Where:**

   - Local terminal

   ```bash path=null start=null
   curl -s "https://pdf.example.com/health" | jq
   ```

2. **Test JWT enforcement** (if JWT_SECRET is set):

   **Where:**

   - Local terminal

   - Without token:

     ```bash path=null start=null
     curl -i -X POST "https://pdf.example.com/render-json" \
       -H "Content-Type: application/json" \
       -d '{"content":"# Test","format":"markdown","output":"pdf"}'
     ```

     You should see `401 UNAUTHORIZED`.

   - With token:

     ```bash path=null start=null
     curl -i -X POST "https://pdf.example.com/render-json" \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer <your_token>" \
       -d '{"content":"# Test","format":"markdown","output":"pdf"}'
     ```

     You should get `200` and a PDF body.

3. **Plugin test**:

   **Where:**

   - Obsidian UI

   Steps:

   - In Obsidian, open a markdown note.
   - Ensure plugin backend is `Remote HTTP service` and settings are correct.
   - Run the export command:
     - *Export current note to LaTeX PDF (default template)*
   - Confirm a PDF is created next to the note.

---

If you extend your template set or change domains/regions, revisit:

- `/templates/<templateId>.tex` in the image
- `ALB_CERT_ARN` and DNS configuration
- Plugin default template and base URL settings
