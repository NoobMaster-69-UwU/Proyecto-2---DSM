package sv.edu.eventocomunitariodsm.data.model

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class Event(
    val id: String,
    val title: String?,
    val date: String?,
    val location: String?,
    val description: String?
)

@JsonClass(generateAdapter = true)
data class CommentRequest(
    val uid: String,
    val comment: String,
    val rating: Int? = null
)

@JsonClass(generateAdapter = true)
data class AttendeeRequest(
    val uid: String
)
