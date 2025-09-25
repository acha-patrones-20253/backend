import jwt from "jsonwebtoken";

export default () => {
  const payload = {
    createdAt: new Date().toISOString() // ejemplo: "2025-09-24T19:32:10.123Z"
  };

  const token = jwt.sign(payload,
    import.meta.env.JWT_KEY!
  );
  // , { expiresIn: "1w" });

  return ({ token })

}