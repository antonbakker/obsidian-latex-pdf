#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ObsidianLatexPdfStack } from '../lib/obsidian-latex-pdf-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID;
const region = process.env.AWS_REGION;

if (!account) {
  throw new Error('AWS_ACCOUNT_ID must be set in the environment');
}
if (!region) {
  throw new Error('AWS_REGION must be set in the environment');
}

// Auto-detect GitHub owner for GHCR image:
// - Prefer GITHUB_REPOSITORY_OWNER (CI)
// - Fallback to first part of GITHUB_REPOSITORY ("owner/repo")
// - Fallback to GHCR_OWNER or GITHUB_USER env vars
const repoOwnerFromRepo = process.env.GITHUB_REPOSITORY?.split('/')[0];
const ghOwner =
  process.env.GITHUB_REPOSITORY_OWNER ||
  repoOwnerFromRepo ||
  process.env.GHCR_OWNER ||
  process.env.GITHUB_USER;

if (!ghOwner) {
  throw new Error(
    'Unable to determine GHCR owner. Set GITHUB_REPOSITORY_OWNER, GHCR_OWNER, or GITHUB_USER.'
  );
}

// Image name/tag must match what your GitHub Actions workflow publishes
// Default tag is "latest"; can be overridden via IMAGE_TAG env (e.g. "0.1.37").
const imageName = `ghcr.io/${ghOwner}/obsidian-latex-pdf`;
const imageTag = process.env.IMAGE_TAG || 'latest';

// Optional domain configuration for HTTPS + DNS wiring.
// SERVICE_DOMAIN: root domain, e.g. "example.com"
// SERVICE_SUBDOMAIN: subdomain, e.g. "latex" → full host latex.example.com
const serviceDomain = process.env.SERVICE_DOMAIN;
const serviceSubdomain = process.env.SERVICE_SUBDOMAIN;

new ObsidianLatexPdfStack(app, 'ObsidianLatexPdfStack', {
  env: { account, region },
  imageName,
  imageTag,
  serviceDomain,
  serviceSubdomain,
});
