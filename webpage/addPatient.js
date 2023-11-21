document.getElementById('addPatientForm').onsubmit = function(event) {
    event.preventDefault();
    sendData();
};

function handleCheckboxChange(checkbox, prefix) {
    if (checkbox.checked) {
        // Tạo ID ngẫu nhiên với định dạng prefix + 5 chữ số
        checkbox.value = prefix + Math.floor(10000 + Math.random() * 90000).toString();
    } else {
        checkbox.value = '';
    }
}
document.getElementById('ip_id').onchange = function() {
    handleCheckboxChange(this, 'IP');
};

document.getElementById('op_id').onchange = function() {
    handleCheckboxChange(this, 'OP');
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
