import React from 'react';
import { Modal as MuiModal, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import 'styles/modal.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <MuiModal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className="modal-overlay"
    >
      <Box className="modal-content" onClick={(e) => e.stopPropagation()}>
        <Box className="modal-header">
          <Typography id="modal-title" className="modal-title">
            {title}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            className="modal-close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ mt: 2 }}>
          {children}
        </Box>
      </Box>
    </MuiModal>
  );
};

export default Modal;
