export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("plant_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("plant_device_id", id);
  }
  return id;
}
