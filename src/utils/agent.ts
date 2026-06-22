// 用于加载时判断用户设备类型，返回是否为PC端
export function isPC() {
  const agents = ['Android', 'iPhone', 'webOS', 'BlackBerry', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod'];

  const isMobile = agents.some(agent => window.navigator.userAgent.includes(agent));

  return !isMobile;
}
