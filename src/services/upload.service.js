const aws = require('aws-sdk');
const config = require('../config/config');
const s3 = new aws.S3(config.aws);
const bucketName = 'klass-vr-file';

async function initiateMultipart({ fileName, contentType, folder }) {
    const Key = `${folder}/${fileName}`;
    const params = { Bucket: bucketName, Key, ContentType: contentType };
    const { UploadId } = await s3.createMultipartUpload(params).promise();
    return { uploadId: UploadId, key: Key };
}

async function getPartPresignedUrls({ uploadId, key, partNumbers }) {
    const urls = await Promise.all(
        partNumbers.map(async (PartNumber) => {
            const url = await s3.getSignedUrlPromise('uploadPart', {
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
                PartNumber,
                Expires: 3600,
            });
            return { PartNumber, url };
        })
    );
    return urls;
}

async function completeMultipart({ uploadId, key, parts }) {
    // If client couldn't read ETag due to CORS, fetch from S3 using listParts
    let useServerParts = false;
    if (!Array.isArray(parts) || parts.length === 0 || parts.some((p) => !p || !p.ETag || !p.PartNumber)) {
        useServerParts = true;
    }

    let finalParts = [];
    if (useServerParts) {
        let isTruncated = true;
        let partNumberMarker;
        while (isTruncated) {
            const resp = await s3
                .listParts({ Bucket: bucketName, Key: key, UploadId: uploadId, PartNumberMarker: partNumberMarker })
                .promise();
            const fetched = (resp.Parts || []).map((p) => ({ PartNumber: p.PartNumber, ETag: p.ETag }));
            finalParts.push(...fetched);
            isTruncated = resp.IsTruncated;
            partNumberMarker = resp.NextPartNumberMarker;
        }
    } else {
        finalParts = parts.map((p) => ({ PartNumber: Number(p.PartNumber), ETag: p.ETag }));
    }

    // sanitize ETags and sort
    const normalizedParts = finalParts
        .map((p) => ({
            PartNumber: Number(p.PartNumber),
            ETag: typeof p.ETag === 'string' && !/^".*"$/.test(p.ETag) ? `"${p.ETag.replace(/\"/g, '"').replace(/"/g, '')}"` : p.ETag,
        }))
        .sort((a, b) => a.PartNumber - b.PartNumber);

    const { Location, Bucket, Key } = await s3
        .completeMultipartUpload({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: { Parts: normalizedParts },
        })
        .promise();
    return { location: Location, bucket: Bucket, key: Key };
}

async function abortMultipart({ uploadId, key }) {
    await s3
        .abortMultipartUpload({ Bucket: bucketName, Key: key, UploadId: uploadId })
        .promise();
    return { aborted: true };
}

module.exports = {
    initiateMultipart,
    getPartPresignedUrls,
    completeMultipart,
    abortMultipart,
};
