import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';

export interface ObsidianLatexPdfStackProps extends cdk.StackProps {
  imageName: string; // e.g. "ghcr.io/<owner>/obsidian-latex-pdf"
  imageTag: string;  // e.g. "0.1.37" or "latest"
  /** Optional root domain, e.g. "example.com". */
  serviceDomain?: string;
  /** Optional subdomain, e.g. "latex"  full host latex.example.com. */
  serviceSubdomain?: string;
  /** Desired Fargate task count; defaults to 1 when omitted. */
  desiredCount?: number;
}

export class ObsidianLatexPdfStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ObsidianLatexPdfStackProps) {
    super(scope, id, props);

    // S3 bucket for input documents
    const inputBucket = new s3.Bucket(this, 'InputBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{ enabled: true, expiration: cdk.Duration.days(30) }],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // VPC + ECS cluster
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      // Non-critical service: use a single NAT gateway / Elastic IP to reduce cost.
      // All private subnets will route through this one NAT; if its AZ fails,
      // outbound internet access for tasks will be impacted.
      natGateways: 1,
    });
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // Fargate service behind an ALB
    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      desiredCount: props.desiredCount ?? 1,
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
  private configureHttpsAndDnsIfPossible(
    service: ecsPatterns.ApplicationLoadBalancedFargateService,
    domain?: string,
    subdomain?: string,
  ) {
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

    let hostedZone: route53.IHostedZone;
    try {
      hostedZone = route53.HostedZone.fromLookup(this, 'ServiceHostedZone', {
        domainName: trimmedDomain,
      });
    } catch (e) {
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
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(service.loadBalancer),
      ),
    });
  }
}
