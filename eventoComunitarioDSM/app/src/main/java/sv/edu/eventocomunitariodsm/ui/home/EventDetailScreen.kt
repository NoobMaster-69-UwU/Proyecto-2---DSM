package sv.edu.eventocomunitariodsm.ui.home

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun EventDetailScreen(
    eventId: String,
    viewModel: EventDetailViewModel,
    userUid: String?,
    onBack: () -> Unit
) {
    val state by viewModel.ui.collectAsState()
    LaunchedEffect(eventId) { viewModel.loadEvent(eventId) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        IconButton(onClick = onBack) { Text("←") }
        state.event?.let { ev ->
            Text(text = (ev as? sv.edu.eventocomunitariodsm.data.model.Event)?.title ?: "Evento")
            Spacer(Modifier.height(8.dp))
            Text(text = (ev as? sv.edu.eventocomunitariodsm.data.model.Event)?.description ?: "")
            Spacer(Modifier.height(12.dp))
            userUid?.let { uid ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { viewModel.confirmAttend(eventId, uid) }) {
                        Text("Confirmar asistencia")
                    }
                    Button(onClick = { viewModel.cancelAttend(eventId, uid) }) {
                        Text("Cancelar asistencia")
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Text("Comentarios", style = MaterialTheme.typography.titleMedium)
            // Aquí podrías listar comentarios llamando a viewModel
            Spacer(Modifier.height(8.dp))
            var commentText by remember { mutableStateOf("") }
            OutlinedTextField(value = commentText, onValueChange = { commentText = it }, label = { Text("Comentario") })
            Spacer(Modifier.height(8.dp))
            var rating by remember { mutableStateOf("") }
            OutlinedTextField(value = rating, onValueChange = { rating = it }, label = { Text("Calificación (opcional)") })
            Spacer(Modifier.height(8.dp))
            Button(onClick = {
                if (!userUid.isNullOrBlank()) {
                    val r = rating.toIntOrNull()
                    viewModel.postComment(eventId, userUid, commentText, r)
                }
            }) {
                Text("Enviar comentario")
            }
        } ?: run {
            if (state.isLoading) CircularProgressIndicator()
            if (state.error != null) Text(state.error ?: "")
        }
    }
}
