document.getElementById('addPatientForm').onsubmit = function(event) {
    event.preventDefault();
    sendData();
};

document.getElementById('ip_id').onchange = function() {
    if (this.checked) {
        this.value = 'IP' + uuid.v4();
    } else {
        this.value = '';
    }
};

document.getElementById('op_id').onchange = function() {
    if (this.checked) {
        this.value = 'OP' + uuid.v4();
    } else {
        this.value = '';
    }
};


function sendData() {
    var formData = new FormData(document.getElementById('addPatientForm'));

    // AJAX call to send data to the server
    fetch('http://localhost:3000/add_patient', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}
