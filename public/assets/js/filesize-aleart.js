document.getElementById('file-input').addEventListener('change', function(event) {
  const files = event.target.files;
  const maxSize = 100 * 1024 * 1024; // 500MB in bytes

  for (let i = 0; i < files.length; i++) {
    if (files[i].size > maxSize) {
      // Clear the file input to prevent the file from being uploaded
      event.target.value = '';

      // Trigger the modal
      $('#filesizealeart').modal('show');
      break;
    }
  }
});



  document.getElementById('hidden-file-input').addEventListener('change', function(event) {
    const files = event.target.files;
    const maxSize = 100 * 1024 * 1024; // 5MB in bytes // 10KB in bytes

    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        // Clear the file input to prevent the file from being uploaded
        event.target.value = '';

        // Trigger the modal
        $('#filesizealeart').modal('show');

        break;
      }
    }
  });
