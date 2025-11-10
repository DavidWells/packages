module.exports = {
  service: 'frontend-service',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: '${opt:stage, "dev"}',
    region: 'us-east-1',
    memorySize: 128,
    timeout: 10,
    environment: {
      STAGE: '${self:provider.stage}',
      BUCKET_NAME: '${self:service}-${self:provider.stage}-assets'
    }
  },
  functions: {
    renderPage: {
      handler: 'lib/render.page',
      events: [
        {
          http: {
            path: '/{proxy+}',
            method: 'get',
            cors: true
          }
        }
      ]
    },
    generateSitemap: {
      handler: 'lib/sitemap.generate',
      events: [
        {
          schedule: {
            rate: 'rate(1 day)',
            enabled: true
          }
        }
      ]
    },
    optimizeImages: {
      handler: 'lib/images.optimize',
      events: [
        {
          s3: {
            bucket: 'uploads',
            event: 's3:ObjectCreated:*',
            rules: [
              {
                prefix: 'images/',
                suffix: '.jpg'
              }
            ]
          }
        }
      ]
    }
  },
  resources: {
    Resources: {
      AssetsBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.BUCKET_NAME}',
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            BlockPublicPolicy: false,
            IgnorePublicAcls: false,
            RestrictPublicBuckets: false
          }
        }
      }
    }
  }
}
