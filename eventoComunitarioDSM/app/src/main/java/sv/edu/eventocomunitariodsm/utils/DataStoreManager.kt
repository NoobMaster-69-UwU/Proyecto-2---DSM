package sv.edu.eventocomunitariodsm.utils

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore("user_prefs")

class DataStoreManager(private val context: Context) {

    companion object {
        val KEY_TOKEN = stringPreferencesKey("KEY_TOKEN")
        val KEY_UID = stringPreferencesKey("KEY_UID")
    }

    suspend fun saveToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_TOKEN] = token
        }
    }

    suspend fun saveUid(uid: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_UID] = uid
        }
    }

    suspend fun clearAll() {
        context.dataStore.edit { prefs ->
            prefs.clear()
        }
    }

    fun tokenFlow(): Flow<String?> =
        context.dataStore.data.map { prefs ->
            prefs[KEY_TOKEN]
        }

    fun uidFlow(): Flow<String?> =
        context.dataStore.data.map { prefs ->
            prefs[KEY_UID]
        }
}
