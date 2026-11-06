/** 与 Vite base 对齐的 public 资源路径（GitHub Pages 子路径部署） */
export function asset(path) {
  const clean = path.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${clean}`
}
