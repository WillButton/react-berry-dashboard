# Deploying React Applications to AWS S3 Using Pulumi

Application code is forked from [React Berry Dashboard](https://appseed.us/product/react-node-js-berry-dashboard).

## Getting Started

- Install [Pulumi](https://www.pulumi.com/docs/get-started/install/)
- Install [Docker Desktop](https://docs.docker.com/desktop/)
- Type `pulumi up`

That will bring the application live on your local desktop.

## Deploying to S3

This deployment uses Github Actions to deploy. In the `Settings` for your Github repo, you'll need to add the following Secrets:
- `AWS_ACCESS_KEY_ID` - Used by Pulumi to manage AWS resources (the S3 bucket and Route53 record)
- `AWS_SECRET_ACCESS_KEY` - Secret for the key specified above
- `AWS_REGION` - Specify the AWS region for your services
- `PULUMI_ACCESS_TOKEN` - Used by Github Actions to call the Pulumi service

## Cool files to checkout

Launching the local Docker dev environment [index.ts](index.ts#43)

Build and launch an S3 web bucket with Route53 DNS record [index.ts](index.ts#80)

Upload files from the build folder to S3 [index.ts](index.ts#28) (Remember each file is treated as an asset by Pulumi and counts towards your total number of resources managed (a.k.a. billing)

Github action to deploy to AWS on merging a pull request to main [push.yml](.github/workflows/push.yml)

If you get stuck or have questions, hit me up on Twitter: [wfbutton](https://twitter.com/wfbutton)
