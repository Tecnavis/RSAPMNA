import React from 'react';
import { TextField, Button, CircularProgress } from '@mui/material';
import { CiEdit } from 'react-icons/ci';

type EditableFieldProps = {
  label: string;
  value: string | number | undefined;
  isEditing: boolean;
  editedValue: string | number | undefined;
  loading: boolean;
  onEditClick: () => void;
  onSaveClick: () => Promise<void>; // Async function for saving
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditable: boolean;
  valueStyle?: React.CSSProperties;
  bookingCheck?: boolean;
};


const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  isEditing,
  editedValue,
  loading,
  onEditClick,
  onSaveClick,
  onChange,
  isEditable,
  valueStyle, // Optional style prop
  bookingCheck,
}) => {
  return isEditing ? (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      
      <TextField
        value={editedValue}
        onChange={onChange}
        label={label}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSaveClick();
          }
        }}
      />
      <Button
        variant="contained"
        style={{ marginLeft: '10px' }}
        onClick={onSaveClick}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Save'}
      </Button>
    </div>
  ) : (
    <>
      <span
        style={{
          color: 'black', // Default color
          fontSize: '1rem', // Default size
          fontWeight: 'normal', // Default weight
          ...valueStyle, // Apply custom styles if provided
        }}
      >
        {value}
      </span>
      {isEditable && !(bookingCheck === true || bookingCheck === null) && (
        <CiEdit
          size={28}
          className="cursor-pointer"
          color="blue"
          onClick={onEditClick}
        />
      )}
    </>
  );
};


export default EditableField;
