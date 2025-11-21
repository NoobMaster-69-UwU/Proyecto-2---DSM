package sv.edu.eventocomunitariodsm.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import sv.edu.eventocomunitariodsm.data.repository.EventRepository
import sv.edu.eventocomunitariodsm.utils.Resource

data class EventDetailUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val attendees: List<Any> = emptyList(),
    val comments: List<Any> = emptyList(),
    val event: Any? = null,
    val successMessage: String? = null
)

class EventDetailViewModel(private val repo: EventRepository = EventRepository()) : ViewModel() {

    private val _ui = MutableStateFlow(EventDetailUiState())
    val ui: StateFlow<EventDetailUiState> = _ui

    fun loadEvent(id: String) {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true)
            when (val r = repo.getEvent(id)) {
                is Resource.Success -> _ui.value = _ui.value.copy(isLoading = false, event = r.data)
                is Resource.Error -> _ui.value = _ui.value.copy(isLoading = false, error = r.message)
                else -> {}
            }
        }
    }

    fun postComment(eventId: String, uid: String, text: String, rating: Int?) {
        viewModelScope.launch {
            when (val r = repo.postComment(eventId, sv.edu.eventocomunitariodsm.data.model.CommentRequest(uid, text, rating))) {
                is Resource.Success -> _ui.value = _ui.value.copy(successMessage = "Comentario agregado")
                is Resource.Error -> _ui.value = _ui.value.copy(error = r.message)
                else -> {}
            }
        }
    }

    fun confirmAttend(eventId: String, uid: String) {
        viewModelScope.launch {
            when (val r = repo.confirmAttend(eventId, uid)) {
                is Resource.Success -> _ui.value = _ui.value.copy(successMessage = "Asistencia confirmada")
                is Resource.Error -> _ui.value = _ui.value.copy(error = r.message)
                else -> {}
            }
        }
    }

    fun cancelAttend(eventId: String, uid: String) {
        viewModelScope.launch {
            when (val r = repo.cancelAttend(eventId, uid)) {
                is Resource.Success -> _ui.value = _ui.value.copy(successMessage = "Asistencia cancelada")
                is Resource.Error -> _ui.value = _ui.value.copy(error = r.message)
                else -> {}
            }
        }
    }
}
