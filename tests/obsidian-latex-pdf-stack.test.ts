import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  ObsidianLatexPdfStack,
  ObsidianLatexPdfStackProps,
} from '../cdk/lib/obsidian-latex-pdf-stack';

const DEFAULT_ENV = { account: '123456789012', region: 'us-east-1' };

function createStack(props: Partial<ObsidianLatexPdfStackProps> = {}) {
  const app = new cdk.App();
  return new ObsidianLatexPdfStack(app, 'TestStack', {
    env: DEFAULT_ENV,
    imageName: 'ghcr.io/test/obsidian-latex-pdf',
    imageTag: 'latest',
    ...props,
  });
}

describe('ObsidianLatexPdfStack infrastructure', () => {
  it('constructs an S3 bucket with correct encryption and lifecycle rules', () => {
    const stack = createStack();
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Status: 'Enabled',
            ExpirationInDays: 30,
          }),
        ]),
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('creates a VPC and ECS cluster', () => {
    const stack = createStack();
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::ECS::Cluster', 1);
  });

  it('sets up an ApplicationLoadBalancedFargateService with correct environment variables', () => {
    const originalJwt = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret';

    const stack = createStack();
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'INPUT_BUCKET_NAME' }),
            Match.objectLike({ Name: 'JSON_MAX_BYTES', Value: '1048576' }),
            Match.objectLike({ Name: 'MULTIPART_MAX_BYTES', Value: '10485760' }),
            Match.objectLike({ Name: 'S3_OBJECT_MAX_BYTES', Value: '104857600' }),
            Match.objectLike({ Name: 'LATEX_ENGINE', Value: 'xelatex' }),
            Match.objectLike({ Name: 'JWT_SECRET', Value: 'test-secret' }),
          ]),
        }),
      ]),
    });

    if (originalJwt === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwt;
    }
  });

  it('configureHttpsAndDnsIfPossible configures HTTPS and DNS when valid domain and subdomain are provided', () => {
    const hostedZoneMock = {
      hostedZoneArn: 'arn:aws:route53:::hostedzone/Z123456789',
      hostedZoneId: 'Z123456789',
      zoneName: 'example.com',
    } as unknown as route53.IHostedZone;

    const fromLookupSpy = vi
      .spyOn(route53.HostedZone, 'fromLookup')
      .mockReturnValue(hostedZoneMock);

    const stack = createStack({
      serviceDomain: 'example.com',
      serviceSubdomain: 'latex',
    });

    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'latex.example.com',
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS',
      Certificates: Match.anyValue(),
    });

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: Match.stringLikeRegexp('^latex\\.example\\.com'),
      Type: 'A',
      AliasTarget: Match.objectLike({
        DNSName: Match.anyValue(),
      }),
    });

    // We mock fromLookup to avoid real AWS context lookups; the assertions
    // below verify that HTTPS and DNS resources are synthesized correctly.
    fromLookupSpy.mockRestore();
  });
});

describe('CDK app environment validation', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  it('throws an error if AWS_ACCOUNT_ID is missing', async () => {
    const env = { ...process.env };
    delete (env as any).AWS_ACCOUNT_ID;
    env.AWS_REGION = env.AWS_REGION || 'us-east-1';
    env.GITHUB_REPOSITORY_OWNER = env.GITHUB_REPOSITORY_OWNER || 'owner';
    process.env = env;

    await expect(import('../cdk/bin/app'))
      .rejects.toThrow('AWS_ACCOUNT_ID must be set in the environment');
  });

  it('throws an error if AWS_REGION is missing', async () => {
    const env = { ...process.env };
    env.AWS_ACCOUNT_ID = env.AWS_ACCOUNT_ID || '123456789012';
    delete (env as any).AWS_REGION;
    env.GITHUB_REPOSITORY_OWNER = env.GITHUB_REPOSITORY_OWNER || 'owner';
    process.env = env;

    await expect(import('../cdk/bin/app'))
      .rejects.toThrow('AWS_REGION must be set in the environment');
  });
});
