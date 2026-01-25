#!/usr/bin/env node
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
const cdk = __importStar(require("aws-cdk-lib"));
const obsidian_latex_pdf_stack_1 = require("../lib/obsidian-latex-pdf-stack");
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
const ghOwner = process.env.GITHUB_REPOSITORY_OWNER ||
    repoOwnerFromRepo ||
    process.env.GHCR_OWNER ||
    process.env.GITHUB_USER;
if (!ghOwner) {
    throw new Error('Unable to determine GHCR owner. Set GITHUB_REPOSITORY_OWNER, GHCR_OWNER, or GITHUB_USER.');
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
new obsidian_latex_pdf_stack_1.ObsidianLatexPdfStack(app, 'ObsidianLatexPdfStack', {
    env: { account, region },
    imageName,
    imageTag,
    serviceDomain,
    serviceSubdomain,
});
