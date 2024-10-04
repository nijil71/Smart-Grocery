import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneInputWithCountryCode = () => {
  const [phone, setPhone] = useState('');

  return (
    <div>
      <PhoneInput
        country={'in'} // Default country (US)
        value={phone}
        onChange={(phone) => setPhone(phone)}
        inputStyle={{ width: '100%' }}
        enableSearch
        required
      />
    </div>
  );
};

export default PhoneInputWithCountryCode;
