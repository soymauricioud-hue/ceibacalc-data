const DB_NAME = 'CeibaCalcDB';
const STORE_NAME = 'patientStore';
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event.target.error);
            reject('Error al abrir la base de datos.');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function saveData(data) {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Usamos una clave fija (1) para siempre sobrescribir los últimos datos.
        // Esto convierte a IndexedDB en un simple almacén de "último estado".
        const dataToStore = { id: 1, ...data };

        const request = store.put(dataToStore);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log('Datos guardados en IndexedDB');
                resolve();
            };
            request.onerror = (event) => {
                console.error('Error al guardar datos:', event.target.error);
                reject('Error al guardar los datos.');
            };
        });
    } catch (error) {
        console.error(error);
    }
}


async function loadData() {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(1); // Cargar siempre el registro con la clave fija 1

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                if (request.result) {
                    console.log('Datos cargados desde IndexedDB');
                    resolve(request.result);
                } else {
                    resolve(null); // No hay datos guardados
                }
            };
            request.onerror = (event) => {
                console.error('Error al cargar datos:', event.target.error);
                reject('Error al cargar los datos.');
            };
        });
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = {
    saveData,
    loadData
};
