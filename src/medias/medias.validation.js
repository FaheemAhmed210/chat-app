const Joi = require('joi');

module.exports = {
  initializeMultipartUpload: {
    body: Joi.object({
      fileName: Joi.string().trim().required(),
      destination: Joi.string().trim().required(),
    })
  },
  createPartsPresignedUrls: {
    body: Joi.object({
      fileKey: Joi.string().trim().required(),
      fileId: Joi.string().trim().required(),
      parts: Joi.number().positive().required()
    })
  },
  finalizeMultipartUpload: {
    body: Joi.object({
      fileKey: Joi.string().trim().required(),
      fileId: Joi.string().trim().required(),
      parts: Joi.array().items(Joi.object().keys({
        PartNumber: Joi.number().positive().required(),
        ETag: Joi.string().trim().required()
      }))
    })
  },
  deleteMultipleMedia: {
    body: Joi.object({
      url: Joi.array()
      .items(Joi.string().uri().required())
      .required()
    
    })
  }
}