import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface ObsidianLatexPdfStackProps extends cdk.StackProps {
  imageName: string; // e.g. "ghcr.io/<owner>/obsidian-latex-pdf"
  imageTag: string;  // e.g. "0.1.37" or "latest"
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
        },
      },
    });

    // Allow service to read from the input bucket
    inputBucket.grantRead(service.taskDefinition.taskRole);

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: service.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'InputBucketName', {
      value: inputBucket.bucketName,
    });
  }
}
