export const SIZE_LABELS: Record<string, string> = {
    'Infant': '0 - 12 months',
    'Toddler': '2 - 5 years',
    'Children': '5 - 12 years',
};

export const SIZE_GUIDE_DATA = [
    // Infant Group
    { ageGroup: 'Infant', age: '0 - 4 mos',    usSize: '0',   ukSize: '0.5', euSize: '16', insoleLength: '4.21' },
    { ageGroup: 'Infant', age: '6 mos',         usSize: '1',   ukSize: '1.5', euSize: '17', insoleLength: '4.49' },
    { ageGroup: 'Infant', age: '8 mos',         usSize: '2',   ukSize: '2.5', euSize: '18', insoleLength: '4.72' },
    { ageGroup: 'Infant', age: '10 - 12 mos',   usSize: '3',   ukSize: '3.5', euSize: '19', insoleLength: '5.00' },
    { ageGroup: 'Infant', age: '1',             usSize: '3.5', ukSize: '4',   euSize: '20', insoleLength: '5.28' },
    { ageGroup: 'Infant', age: '1.5',           usSize: '4',   ukSize: '4.5', euSize: '21', insoleLength: '5.51' },
    { ageGroup: 'Infant', age: '2',             usSize: '4.5', ukSize: '5',   euSize: '22', insoleLength: '5.83' },

    // Toddler Group
    { ageGroup: 'Toddler', age: '2',    usSize: '5',  ukSize: '5.5', euSize: '23', insoleLength: '6.02' },
    { ageGroup: 'Toddler', age: '2.5',  usSize: '6',  ukSize: '6',   euSize: '24', insoleLength: '6.30' },
    { ageGroup: 'Toddler', age: '3',    usSize: '7',  ukSize: '6.5', euSize: '25', insoleLength: '6.57' },
    { ageGroup: 'Toddler', age: '3.5',  usSize: '8',  ukSize: '7.5', euSize: '26', insoleLength: '6.85' },
    { ageGroup: 'Toddler', age: '4',    usSize: '9',  ukSize: '8.5', euSize: '27', insoleLength: '7.13' },
    { ageGroup: 'Toddler', age: '5',    usSize: '10', ukSize: '9.5', euSize: '28', insoleLength: '7.40' },

    // Children Group
    { ageGroup: 'Children', age: '5',        usSize: '11', ukSize: '10.5', euSize: '29', insoleLength: '7.64' },
    { ageGroup: 'Children', age: '5.5',      usSize: '12', ukSize: '11.5', euSize: '30', insoleLength: '7.91' },
    { ageGroup: 'Children', age: '6',        usSize: '13', ukSize: '12.5', euSize: '31', insoleLength: '8.15' },
    { ageGroup: 'Children', age: '6.5',      usSize: '1',  ukSize: '13',   euSize: '32', insoleLength: '8.43' },
    { ageGroup: 'Children', age: '7',        usSize: '2',  ukSize: '1',    euSize: '33', insoleLength: '8.66' },
    { ageGroup: 'Children', age: '7.5',      usSize: '3',  ukSize: '2',    euSize: '34', insoleLength: '8.94' },
    { ageGroup: 'Children', age: '8',        usSize: '4',  ukSize: '3',    euSize: '35', insoleLength: '9.17' },
    { ageGroup: 'Children', age: '9 to 10',  usSize: '5',  ukSize: '4',    euSize: '36', insoleLength: '9.45' },
    { ageGroup: 'Children', age: '11 to 12', usSize: '6',  ukSize: '5',    euSize: '37', insoleLength: '9.72' },
];

export const INDIAN_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
];

export const ALL_EU_SIZES = Array.from({ length: 22 }, (_, i) => (i + 16).toString());
