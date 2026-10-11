const generateSlug = (name) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const random = Math.random().toString(36).substring(2, 7);
  return `${base}-${random}`;
};

export default generateSlug;