from storages.backends.s3 import S3Storage


class MediaS3Storage(S3Storage):
    """Default storage for Wagtail Image originals + Document originals + auto-generated
    renditions.

    querystring_auth=False emits unsigned URLs for ALL files. Bucket policy gates
    public access per-prefix:
      - originals/  : no anonymous policy -> 403 to public (admin uploads via authed S3 calls)
      - images/     : public-read policy  -> 200 to public (renditions, cacheable, prerender-safe)
      - documents/  : no anonymous policy -> 403 to public
    """

    location = ""
    file_overwrite = False
    querystring_auth = False
