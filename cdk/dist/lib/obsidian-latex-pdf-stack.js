"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObsidianLatexPdfStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ecsPatterns = __importStar(require("aws-cdk-lib/aws-ecs-patterns"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const acm = __importStar(require("aws-cdk-lib/aws-certificatemanager"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
const route53Targets = __importStar(require("aws-cdk-lib/aws-route53-targets"));
class ObsidianLatexPdfStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // S3 bucket for input documents
        const inputBucket = new s3.Bucket(this, 'InputBucket', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            lifecycleRules: [{ enabled: true, expiration: cdk.Duration.days(30) }],
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });
        // VPC + ECS cluster
        const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2 });
        const cluster = new ecs.Cluster(this, 'Cluster', { vpc });
        // Fargate service behind an ALB
        const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
            cluster,
            desiredCount: 1,
            cpu: 512,
            memoryLimitMiB: 1024,
            publicLoadBalancer: true,
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
        });
        // Configure optional HTTPS + DNS wiring if SERVICE_DOMAIN/SERVICE_SUBDOMAIN
        // are provided and a matching hosted zone exists in this account.
        this.configureHttpsAndDnsIfPossible(service, props.serviceDomain, props.serviceSubdomain);
        // Allow service to read from the input bucket
        inputBucket.grantRead(service.taskDefinition.taskRole);
        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: service.loadBalancer.loadBalancerDnsName,
        });
        new cdk.CfnOutput(this, 'InputBucketName', {
            value: inputBucket.bucketName,
        });
    }
    /**
     * Best-effort HTTPS + DNS setup driven by SERVICE_DOMAIN/SERVICE_SUBDOMAIN.
     *
     * If both are provided and a matching Route 53 hosted zone exists in this
     * account, CDK will:
     * - Create a DNS-validated ACM certificate for `${sub}.${domain}`.
     * - Add an HTTPS listener (port 443) on the ALB.
     * - Create an A/alias record in the hosted zone pointing the subdomain to
     *   the ALB.
     *
     * If anything fails (missing envs, no hosted zone, etc.), it silently falls
     * back to HTTP-only (no HTTPS listener, no DNS records).
     */
    configureHttpsAndDnsIfPossible(service, domain, subdomain) {
        // Quick sanity checks on inputs
        if (!domain || !subdomain) {
            return;
        }
        const trimmedDomain = domain.trim();
        const trimmedSub = subdomain.trim();
        if (!trimmedDomain || !trimmedSub) {
            return;
        }
        // Very light validation: domain should contain a dot, subdomain no spaces.
        if (!trimmedDomain.includes('.') || /\s/.test(trimmedSub)) {
            return;
        }
        const fullHostname = `${trimmedSub}.${trimmedDomain}`;
        let hostedZone;
        try {
            hostedZone = route53.HostedZone.fromLookup(this, 'ServiceHostedZone', {
                domainName: trimmedDomain,
            });
        }
        catch (e) {
            // Hosted zone not found in this account/region; fall back to HTTP-only.
            return;
        }
        // Create a DNS-validated ACM certificate for the full hostname.
        const certificate = new acm.Certificate(this, 'AlbCertificate', {
            domainName: fullHostname,
            validation: acm.CertificateValidation.fromDns(hostedZone),
        });
        // Add an HTTPS listener on port 443 using this certificate.
        service.loadBalancer.addListener('HttpsListener', {
            port: 443,
            certificates: [certificate],
            defaultTargetGroups: [service.targetGroup],
        });
        // Create/update A/alias record: <subdomain>.<domain> -> ALB
        new route53.ARecord(this, 'ServiceAliasRecord', {
            zone: hostedZone,
            recordName: trimmedSub,
            target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(service.loadBalancer)),
        });
    }
}
exports.ObsidianLatexPdfStack = ObsidianLatexPdfStack;
