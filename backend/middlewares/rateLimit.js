const requests = new Map();

const rateLimit = ({ windowMs, max, message }) => (req, res, next) => {
  const now = Date.now();
  const key = `${req.ip}:${req.baseUrl}${req.path}`;
  const record = requests.get(key);

  if (!record || record.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    if (requests.size > 10000) {
      for (const [storedKey, storedValue] of requests) {
        if (storedValue.resetAt <= now) requests.delete(storedKey);
      }
    }
    return next();
  }

  record.count += 1;
  if (record.count > max) {
    res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
    return res.status(429).json({ message });
  }
  return next();
};

export default rateLimit;
