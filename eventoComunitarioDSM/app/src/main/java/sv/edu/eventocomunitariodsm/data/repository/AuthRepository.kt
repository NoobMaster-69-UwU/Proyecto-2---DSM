package sv.edu.eventocomunitariodsm.data.repository

import sv.edu.eventocomunitariodsm.data.model.AuthResponse
import sv.edu.eventocomunitariodsm.data.model.LoginRequest
import sv.edu.eventocomunitariodsm.data.model.RegisterRequest
import sv.edu.eventocomunitariodsm.data.remote.ApiClient
import sv.edu.eventocomunitariodsm.utils.Resource

class AuthRepository {

    private val api = ApiClient.authApi

    suspend fun login(email: String, password: String): Resource<AuthResponse> {
        return try {
            val response = api.login(LoginRequest(email, password))
            Resource.Success(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Error desconocido")
        }
    }

    suspend fun register(username: String, email: String, password: String): Resource<AuthResponse> {
        return try {
            val response = api.register(RegisterRequest(username, email, password))
            Resource.Success(response)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Error desconocido")
        }
    }
}