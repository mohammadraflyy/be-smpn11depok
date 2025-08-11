-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 11, 2025 at 05:29 AM
-- Server version: 8.0.30
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smpn11depok`
--

-- --------------------------------------------------------

--
-- Table structure for table `absence`
--

CREATE TABLE `absence` (
  `id` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `nisn` varchar(255) NOT NULL,
  `status` enum('pulang','masuk','izin','sakit','alpha') NOT NULL,
  `status_message` enum('pending','failed','success') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_late` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `absence`
--

INSERT INTO `absence` (`id`, `date`, `time`, `nisn`, `status`, `status_message`, `created_at`, `updated_at`, `is_late`) VALUES
('0c2d543a-5302-4e77-82bd-e66690405266', '2025-08-05', '18:01:38', '123123123', 'masuk', 'pending', '2025-08-05 11:01:38', '2025-08-05 11:01:38', 0),
('2d258780-2361-4631-8573-5059f09fae57', '2025-08-06', '16:08:25', '123123123', 'masuk', 'pending', '2025-08-06 09:08:25', '2025-08-06 09:08:25', 1),
('737e4614-3f51-4325-83ef-e092337b751a', '2025-08-06', '16:21:18', '123123123', 'pulang', 'pending', '2025-08-06 09:21:18', '2025-08-06 09:21:18', 1),
('ddec01c7-ea0b-4b0f-9d89-fccf26b81927', '2025-08-06', '16:26:48', '123123123', 'izin', 'pending', '2025-08-06 09:26:48', '2025-08-06 09:26:48', 0),
('4d9ed4e7-0d63-44a6-bdc6-20b938392cf1', '2025-08-07', '14:35:29', '123123123', 'masuk', 'pending', '2025-08-07 07:35:29', '2025-08-07 07:35:29', 1);

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `teacher_id` varchar(255) NOT NULL,
  `whatsapp_group_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `class`, `teacher_id`, `whatsapp_group_id`, `created_at`, `updated_at`) VALUES
('5b8db059-41c7-4b57-98d8-f692be9c70ca', 'test', 'f7373752-a8ae-40c7-b6bc-7d307fcae991', 12312312, '2025-08-05 10:22:29', '2025-08-05 10:22:29');

-- --------------------------------------------------------

--
-- Table structure for table `setting_waktu`
--

CREATE TABLE `setting_waktu` (
  `id` int NOT NULL,
  `jenis` enum('masuk','pulang') NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `setting_waktu`
--

INSERT INTO `setting_waktu` (`id`, `jenis`, `jam_mulai`, `jam_selesai`) VALUES
(1, 'masuk', '05:00:00', '07:00:00'),
(2, 'pulang', '12:00:00', '13:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` varchar(255) NOT NULL,
  `nisn` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `parent_number` varchar(13) NOT NULL,
  `qr_token` text NOT NULL,
  `class` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `nisn`, `name`, `parent_number`, `qr_token`, `class`, `created_at`, `updated_at`) VALUES
('9ab6c7ed-fdff-4635-999d-6ff386ebcd36', '123123123', 'Irpantod', '6282217567330', '9100226d-a09b-4546-ada1-1c39c8ebece8', '5b8db059-41c7-4b57-98d8-f692be9c70ca', '2025-08-05 10:25:44', '2025-08-05 10:25:44');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','operator','guru') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `password`, `role`, `created_at`, `updated_at`) VALUES
('f7373752-a8ae-40c7-b6bc-7d307fcae991', 'test@gmail.com', 'test', '$2b$10$oyd76rFT7VlDSpeDoWpRDebO.rLNSK48PMTX4ya51ePs6ZzfLsR7e', 'guru', '2025-08-05 10:18:42', '2025-08-05 10:18:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `whatsapp_group_id` (`whatsapp_group_id`);

--
-- Indexes for table `setting_waktu`
--
ALTER TABLE `setting_waktu`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD KEY `class` (`class`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `setting_waktu`
--
ALTER TABLE `setting_waktu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
