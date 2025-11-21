package sv.edu.eventocomunitariodsm.utils

import okhttp3.Interceptor
import okhttp3.Response

class TokenInterceptor(
    private val tokenProvider: () -> String?
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenProvider()
        val original = chain.request()

        return if (!token.isNullOrBlank()) {
            val req = original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            chain.proceed(req)
        } else {
            chain.proceed(original)
        }
    }
}
