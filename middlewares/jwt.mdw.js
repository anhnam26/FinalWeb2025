import jwt from 'jsonwebtoken';

export function jwtAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send('No token');

    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).send('Invalid token');
    }
}
