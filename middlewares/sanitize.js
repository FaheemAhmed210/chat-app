const striptags = require("striptags");

function deepSanitize(obj) {
  if (typeof obj === "string") {
    return striptags(obj);
  } else if (Array.isArray(obj)) {
    return obj.map((item) => deepSanitize(item));
  } else if (obj && typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = deepSanitize(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

function sanitizeAll(req, res, next) {
  req.body = deepSanitize(req.body);
  req.query = deepSanitize(req.query);
  req.params = deepSanitize(req.params);
  next();
}

module.exports = sanitizeAll;
