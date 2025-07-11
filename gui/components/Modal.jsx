const Modal = ({ platform, onAuth, onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Login to {platform}</h2>
        <button onClick={onAuth}>Authenticate</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default Modal;
