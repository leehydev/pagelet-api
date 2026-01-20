export default () => ({
  s3: {
    bucket: process.env.AWS_S3_BUCKET || 'pagelet-uploads',
    region: process.env.AWS_S3_REGION || 'ap-northeast-2',
    assetsCdnUrl: process.env.ASSETS_CDN_URL || 'https://assets.pagelet-dev.kr',
  },
});
