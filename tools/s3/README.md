This folder contains the CORS configuration files for the S3 buckets used for uploads in the Digital Engagement Platform. (The backup buckets do not require CORS configuration, as files are uploaded by service accounts and not accessed directly from the browser.)

The `bucket_cors_uploads_<env>.xml` files contain the CORS configuration for the respective environments (dev, test, prod). When creating a new bucket, ensure that the appropriate CORS configuration file is updated with the new web URL and any necessary allowed methods.

Example:

```bash
# Set up the S3 endpoint if not already configured
mc alias set dell_s3 $S3_ENDPOINT $S3_USER $S3_PASSWORD
# Apply the CORS configuration to the new bucket
mc cors set dell_s3/your-new-bucket-dev bucket_cors_uploads_dev.xml

mc cors set dell_s3/your-new-bucket-test bucket_cors_uploads_test.xml

mc cors set dell_s3/your-new-bucket-prod bucket_cors_uploads_prod.xml
```

You will probably also wish to enable anonymous downloads for the new bucket, which can be done with the following command:

```bash
mc anonymous set download dell_s3/your-new-bucket-dev
mc anonymous set download dell_s3/your-new-bucket-test
mc anonymous set download dell_s3/your-new-bucket-prod

# Note: anonymous access can also be set per-folder if desired, using a command like:
mc anonymous set download dell_s3/your-new-bucket-dev/path/to/folder
```

Note: The config file for the dev bucket includes an additional CORS rule to allow requests from `http://localhost:3000` for local development purposes.
