// import { createSharedComposable } from '@vueuse/core'
import { useCookie } from "#app";
// import { decodeJwt, JwtPayload } from "~/utils";
import { decodeJwt } from "~/utils";
import type { JwtPayload } from "~/utils";

interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

function encode(value: string): string {
  if (process.client) return btoa(value);
  return Buffer.from(value).toString("base64");
}

function decode(value: string): string {
  if (process.client) return atob(value);
  return Buffer.from(value, "base64").toString("utf8");
}

// Đã cập nhật chức năng xác thực để mỗi lệnh gọi sẽ đọc mã thông báo truy cập từ cookie thay vì 
// chia sẻ một phiên bản toàn cục. Điều này ngăn chặn mã thông báo cũ trong quá trình tải lại SSR.
// const _useAuth = () => {
export const useAuth = () => {
  const router = useRouter();
  //   const stored = useStorage<string | null>('access_token', null)
  const stored = useCookie<string | null>("access_token", {
    sameSite: "lax",
    path: "/",
  });

  const accessToken = computed<string | null>({
    get() {
      return stored.value ? decode(stored.value) : null;
    },
    set(val) {
      stored.value = val ? encode(val) : null;
    },
  });

  const isLoggedIn = computed(() => !!accessToken.value);

  const userInfo = computed<(JwtPayload & { role?: string | string[] }) | null>(() => {
    if (!accessToken.value) return null
    return decodeJwt(accessToken.value)
  })

  async function login(email: string, password: string) {
    // const { data, error } = await useFetch<LoginResponse>('https://tbu-test.vnnsoft.com/api/v1/Identity/login', {
    //   method: 'POST',
    //   body: { email, password }
    // })
    const { data, error } = await useApiFetch<LoginResponse>(
      "https://tbu-test.vnnsoft.com/api/v1/Identity/login",
      {
        method: "POST",
        body: { email, password },
      }
    );

    if (error.value) throw error.value;

    if (data.value?.accessToken) {
      accessToken.value = data.value.accessToken;
    }
  }

  function logout() {
    accessToken.value = null;
    router.push("/login");
  }

  return {
    accessToken,
    isLoggedIn,
    userInfo,
    login,
    logout,
  };
  // }

  // export const useAuth = createSharedComposable(_useAuth)
};
