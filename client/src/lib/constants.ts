export const SIZE_LABELS = {
    XS: '1-9 months',
    S: '10 months - 2 years',
    M: '2-4 years',
    L: '4-5 years',
    XL: '5-6 years',
    XXL: '7-8 years',
};

export const SIZE_GUIDE_DATA = [
    // XS Group
    { ourSize: 'XS', age: '1-3 Months', eu: '13', inch: '3.5"', cm: '8.9' },
    { ourSize: 'XS', age: '1-3 Months', eu: '14', inch: '3.625"', cm: '9.2' },
    { ourSize: 'XS', age: '3-6 Months', eu: '15', inch: '3.75"', cm: '9.5' },
    { ourSize: 'XS', age: '3-6 Months', eu: '16', inch: '3.875"', cm: '9.8' },
    { ourSize: 'XS', age: '6-9 Months', eu: '17', inch: '4.125"', cm: '10.5' },
    { ourSize: 'XS', age: '6-9 Months', eu: '18', inch: '4.25"', cm: '10.8' },

    // S Group
    { ourSize: 'S', age: '10-12 Months', eu: '19', inch: '4.5"', cm: '11.4' },
    { ourSize: 'S', age: '12-15 Months', eu: '20', inch: '4.75"', cm: '12.1' },
    { ourSize: 'S', age: '15-18 Months', eu: '21', inch: '4.875"', cm: '12.4' },
    { ourSize: 'S', age: '1.5-2 Years', eu: '22', inch: '5.125"', cm: '13' },

    // M Group
    { ourSize: 'M', age: '2-2.5 Years', eu: '23', inch: '5.5"', cm: '14' },
    { ourSize: 'M', age: '2.5-3 Years', eu: '24', inch: '5.75"', cm: '14.6' },
    { ourSize: 'M', age: '3-4 Years', eu: '25', inch: '6.125"', cm: '15.6' },

    // L Group
    { ourSize: 'L', age: '4-4.5 Years', eu: '26', inch: '6.25"', cm: '15.9' },
    { ourSize: 'L', age: '4.5-5 Years', eu: '27', inch: '6.5"', cm: '16.5' },
    { ourSize: 'L', age: '5 Years', eu: '28', inch: '6.75"', cm: '17.1' },

    // XL Group
    { ourSize: 'XL', age: '5-5.5 Years', eu: '29', inch: '6.875"', cm: '17.5' },
    { ourSize: 'XL', age: '5.5-6 Years', eu: '30', inch: '7.125"', cm: '18.1' },
    { ourSize: 'XL', age: '6 Years', eu: '31', inch: '7.5"', cm: '19.1' },

    // XXL Group
    { ourSize: 'XXL', age: '7 Years', eu: '32', inch: '7.75"', cm: '19.7' },
    { ourSize: 'XXL', age: '8 Years', eu: '33', inch: '8.125"', cm: '20.6' },

    // Teen / Large Group
    { ourSize: 'XXL', age: '8-9 Years', eu: '34', inch: '8.375"', cm: '21.3' },
    { ourSize: 'XXL', age: '9-10 Years', eu: '35', inch: '8.625"', cm: '22.0' },
    { ourSize: 'XXL', age: '10-11 Years', eu: '36', inch: '8.875"', cm: '22.7' },
    { ourSize: 'XXL', age: '11-12 Years', eu: '37', inch: '9.125"', cm: '23.3' },
    { ourSize: 'XXL', age: '12+ Years', eu: '38', inch: '9.45"', cm: '24.0' },
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

export const ALL_EU_SIZES = Array.from({ length: 26 }, (_, i) => (i + 13).toString());
