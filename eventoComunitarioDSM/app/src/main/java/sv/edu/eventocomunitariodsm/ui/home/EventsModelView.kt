package sv.edu.eventocomunitariodsm.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import sv.edu.eventocomunitariodsm.data.model.Event
import sv.edu.eventocomunitariodsm.data.repository.EventRepository
import sv.edu.eventocomunitariodsm.utils.Resource

data class EventsUiState(
    val isLoading: Boolean = false,
    val events: List<Event> = emptyList(),
    val error: String? = null
)

class EventsViewModel(private val repo: EventRepository = EventRepository()) : ViewModel() {

    private val _ui = MutableStateFlow(EventsUiState())
    val ui: StateFlow<EventsUiState> = _ui

    fun load() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, error = null)
            when (val res = repo.getEvents()) {
                is Resource.Success -> _ui.value = _ui.value.copy(isLoading = false, events = res.data)
                is Resource.Error -> _ui.value = _ui.value.copy(isLoading = false, error = res.message)
                else -> {}
            }
        }
    }
}
