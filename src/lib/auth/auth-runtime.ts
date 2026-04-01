import { getContext, setContext } from "svelte"
import type { User } from "../simple-comment-types"
import { createAuthController, type AuthController } from "./auth-controller"

const AUTH_RUNTIME_CONTEXT = Symbol("simple-comment-auth-runtime")

export type AuthRuntime = {
  controller: AuthController
  start(): Promise<void>
  stop(): void
}

export const createAuthRuntime = ({
  initialUser,
}: {
  initialUser?: User
} = {}): AuthRuntime => {
  const controller = createAuthController({ initialUser })

  return {
    controller,
    async start() {
      await controller.init()
    },
    stop() {
      controller.destroy()
    },
  }
}

export const provideAuthRuntime = (runtime: AuthRuntime): AuthRuntime => {
  setContext(AUTH_RUNTIME_CONTEXT, runtime)
  return runtime
}

export const useAuthRuntime = (): AuthRuntime => {
  const runtime = getContext<AuthRuntime>(AUTH_RUNTIME_CONTEXT)

  if (!runtime) {
    throw new Error(
      "Simple Comment auth runtime is unavailable outside SimpleComment."
    )
  }

  return runtime
}
