package sv.edu.eventocomunitariodsm.ui.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.Alignment
import sv.edu.eventocomunitariodsm.data.model.Event

@Composable
fun EventsListScreen(
    viewModel: EventsViewModel,
    onOpenEvent: (String) -> Unit
) {
    val state by viewModel.ui.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    Box(modifier = Modifier.fillMaxSize().padding(8.dp)) {
        when {
            state.isLoading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            state.error != null -> Text(state.error ?: "Error", modifier = Modifier.align(Alignment.Center))
            else -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.events) { e ->
                        EventCard(e) { onOpenEvent(e.id) }
                    }
                }
            }
        }
    }
}

@Composable
fun EventCard(event: Event, onClick: () -> Unit) {
    Card(modifier = Modifier
        .fillMaxWidth()
        .clickable(onClick = onClick)
        .padding(4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = event.title ?: "Sin título", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(4.dp))
            Text(text = event.date ?: "", style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(8.dp))
            Text(text = event.location ?: "", style = MaterialTheme.typography.bodySmall)
        }
    }
}
