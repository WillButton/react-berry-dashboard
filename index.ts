import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker";
import * as mime from "mime";
import * as fs from "fs";

const stack = pulumi.getStack();

// S3 bucket policy to allow public read of all objects
function publicReadPolicyForBucket(bucketName: any) {
    return JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: [
                "s3:GetObject"
            ],
            Resource: [
                `arn:aws:s3:::${bucketName}/*`
            ]
        }]
    })
}

// Upload build assets to S3
function uploadToS3(buildDir: string, bucket: aws.s3.Bucket, subDir: string = '') {
    for (let item of require("fs").readdirSync(`${buildDir}${subDir}`)) {
        const filePath = require("path").join(buildDir, subDir, item);
        if (fs.statSync(filePath).isDirectory()) {
            uploadToS3(`${buildDir}`, bucket, `${subDir}/${item}`)
        } else {
            const object = new aws.s3.BucketObject(subDir.length > 0 ? `${subDir.slice(1)}/${item}` : item, {
                bucket: bucket,
                source: new pulumi.asset.FileAsset(filePath),
                contentType: mime.getType(filePath) || undefined
            })
        }
    }
}

if (stack === 'dev') {
// Local Dev environment
    const uiImageName = "react-berry";
    const frontend = new docker.Image("react-berry", {
        build: {
            context: `${process.cwd()}/app`,
        },
        imageName: `${uiImageName}:${stack}`,
        skipPush: true,
    })

    const network = new docker.Network("network", {
        name: `berry-ui-${stack}`
    })

    const uiContainer = new docker.Container("uiContainer", {
        image: frontend.baseImageName,
        name: `react-berry-${stack}`,
        ports: [
            {
                internal: 3000,
                external: 3000
            }
        ],
        networksAdvanced: [
            {
                name: network.name,
            }
        ],
        mounts: [
            {
                target: "/app",
                type: "bind",
                source: `${process.cwd()}/app`
            }
        ]
    })
} else if (stack === 'prod') {
// Prod environment in AWS
    const bucket = new aws.s3.Bucket("react-berry-dashboard", {
        bucket: `${stack}.devopsfordevelopers.io`,
        acl: "public-read",
        website: {
            indexDocument: "index.html"
        }
    })

    // Get the hosted zone
    const hostedZoneId = aws.route53
        .getZone({name: 'devopsfordevelopers.io'}, {async: true})
        .then(zone => zone.zoneId)

    // Create A-record
    const record = new aws.route53.Record("targetDomain", {
        name: `${stack}.devopsfordevelopers.io`,
        zoneId: hostedZoneId,
        type: "A",
        aliases: [{
            zoneId: bucket.hostedZoneId,
            name: bucket.websiteDomain,
            evaluateTargetHealth: true
        }]
    })

    // upload the contents of build to the S3 bucket
    const buildDir = `${process.cwd()}/app/build/`
    uploadToS3(buildDir, bucket)

    // Set access policy for the bucket so all objects are readable
    const bucketPolicy = new aws.s3.BucketPolicy('bucketPolicy', {
        bucket: bucket.bucket,
        policy: bucket.bucket.apply(publicReadPolicyForBucket)
    })

    exports.websiteUrl = bucket.websiteEndpoint;
    exports.dnsName = record.fqdn
} else {
    console.log('what are you trying to do?')
}
