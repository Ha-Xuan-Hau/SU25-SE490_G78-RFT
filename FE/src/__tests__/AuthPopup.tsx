export const AuthPopup = ({ isOpen, onClose }: any) => {
  if (!isOpen) return null;

  return (
    <div data-testid="auth-popup">
      <button onClick={onClose}>Close</button>
      <div>Please login to continue</div>
    </div>
  );
};
