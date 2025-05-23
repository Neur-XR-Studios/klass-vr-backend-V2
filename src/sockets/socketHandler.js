// const { io } = require('../app');
// const { Device } = require('../models');

// io.on('connection', (socket) => {
//   console.log('a user connected');

//   // Active Device
//   socket.on('activeDevice', async (data) => {
//     console.log('activeDevice1 :', data);
//     try {
//       const obj = JSON.parse(data);
//       const school = await Device.findOne({ deviceID: obj.deviceId }).populate('schoolID').exec();
//       const schoolId = school.schoolID._id;

//       // Count total devices belonging to the school
//       const totalDevices = await Device.countDocuments({ schoolID: schoolId });

//       // Count online devices (isOnline: true) based on the socket data
//       const isOnline = obj.isOnline;
//       const onlineDevices = isOnline ? 1 : 0;

//       // Count offline devices as totalDevices - onlineDevices
//       const offlineDevices = totalDevices - onlineDevices;

//       obj.schoolId = schoolId;
//       obj.totalDevices = totalDevices;
//       obj.onlineDevices = onlineDevices;
//       obj.offlineDevices = offlineDevices;
//       io.emit('activeDevice', obj);
//     } catch (error) {
//       console.error(error);
//     }
//   });

//   // Sync Device
//   // Array of 10 device IDs
//   const deviceIds = [
//     'a14a7ca59023762e8dc036b68fad4f7b20433b6e',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b61',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b62',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b63',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b64',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b65',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b66',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b67',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b68',
//     'a14a7ca59023762e8dc036b68fad4f7b20433b69',
//   ];

//   // Index to track which device ID to use next
//   let currentIndex = 0;

//   // Function to generate fake data
//   function generateFakeData() {
//     // Get the current device ID
//     const deviceId = deviceIds[currentIndex];

//     // Generate fake school ID
//     const schoolId = '6606ee70a335238c30484e75';

//     // Generate fake completion status
//     const isCompleted = Math.random() < 0.5;

//     // Increment the index for the next iteration, and wrap around if needed
//     currentIndex = (currentIndex + 1) % deviceIds.length;

//     // Return the generated object
//     return { deviceId, isCompleted, schoolId };
//   }

//   // Send fake data at regular intervals
//   setInterval(() => {
//     try {
//       // Generate fake data
//       const fakeData = generateFakeData();

//       // Emit the fake data through syncDevice event
//       io.emit('syncDevice', fakeData);
//     } catch (error) {
//       console.error(error);
//     }
//   }, 3000); // Interval set to 1 second (1000 milliseconds)
// });

// module.exports = io;
