import { mount } from "svelte"
import AuthRuntimeHarness from "./AuthRuntimeHarness.svelte"

const target = document.getElementById("auth-runtime-harness")

if (!target) {
  throw new Error("Auth runtime harness target is missing.")
}

mount(AuthRuntimeHarness, {
  target,
})
