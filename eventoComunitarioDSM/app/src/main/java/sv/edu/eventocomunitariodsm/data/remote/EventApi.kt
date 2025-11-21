package sv.edu.eventocomunitariodsm.data.remote

import retrofit2.http.*
import sv.edu.eventocomunitariodsm.data.model.*

interface EventApi {

    @GET("events")
    suspend fun getEvents(): List<Event>

    @GET("events/{id}")
    suspend fun getEvent(@Path("id") id: String): Event

    @POST("events/{id}/comments")
    suspend fun postComment(
        @Path("id") id: String,
        @Body request: CommentRequest
    ): Any

    @GET("events/{id}/comments")
    suspend fun getComments(@Path("id") id: String): List<Any>

    @POST("attend/{eventId}/confirm")
    suspend fun confirmAttend(
        @Path("eventId") eventId: String,
        @Body request: AttendeeRequest
    ): Any

    @POST("attend/{eventId}/cancel")
    suspend fun cancelAttend(
        @Path("eventId") eventId: String,
        @Body request: AttendeeRequest
    ): Any

    @GET("attend/{eventId}/attendees")
    suspend fun getAttendees(@Path("eventId") eventId: String): List<Any>
}
