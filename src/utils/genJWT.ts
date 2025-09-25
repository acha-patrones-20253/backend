import jwt from "jsonwebtoken";

export default () => {
  const payload = {
    createdAt: new Date().toISOString()
  };

  const token = jwt.sign(payload,
    import.meta.env.JWT_KEY!
  );

  return ({ token })

}