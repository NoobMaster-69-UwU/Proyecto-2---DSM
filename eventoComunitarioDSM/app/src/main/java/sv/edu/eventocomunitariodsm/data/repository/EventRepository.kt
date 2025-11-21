package sv.edu.eventocomunitariodsm.data.repository

import sv.edu.eventocomunitariodsm.data.model.AttendeeRequest
import sv.edu.eventocomunitariodsm.data.model.CommentRequest
import sv.edu.eventocomunitariodsm.data.model.Event
import sv.edu.eventocomunitariodsm.data.remote.ApiClient
import sv.edu.eventocomunitariodsm.utils.Resource

class EventRepository {
    private val api = ApiClient.eventApi

    suspend fun getEvents(): Resource<List<Event>> {
        return try {
            val list = api.getEvents()
            Resource.Success(list)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Error obteniendo eventos")
        }
    }

    suspend fun getEvent(id: String): Resource<Event> {
        return try {
            val ev = api.getEvent(id)
            Resource.Success(ev)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Error evento")
        }
    }

    suspend fun postComment(eventId: String, req: CommentRequest): Resource<Unit> {
        return try {
            api.postComment(eventId, req)
            Resource.Success(Unit)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Error comentando")
        }
    }

    suspend fun confirmAttend(eventId: String, uid: String): Resource<Unit> {
        return try {
            api.confirmAttend(eventId, AttendeeRequest(uid))
            Resource.Success(Unit)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Error confirmando")
        }
    }

    suspend fun cancelAttend(eventId: String, uid: String): Resource<Unit> {
        return try {
            api.cancelAttend(eventId, AttendeeRequest(uid))
            Resource.Success(Unit)
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Error cancelando")
        }
    }
}
