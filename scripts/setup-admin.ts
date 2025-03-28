#!/usr/bin/env bun

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { input, password, confirm, select } from '@inquirer/prompts';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Missing Supabase credentials in .env.local file'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Путь к директории с SQL файлами
const SQL_DIR = path.join(process.cwd(), 'lib', 'supabase', 'sql');

// SQL файлы в порядке выполнения
const SQL_FILES = [
  'permissions.sql',
  'roles.sql',
  'roles_permissions.sql',
  'users.sql'
];

// Промисифицируем spawn для использования async/await
const execCommand = async (command: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
};

// Вывод в консоль с красивым форматированием
function printHeader(text: string) {
  console.log(chalk.bold.cyan(`\n=== ${text} ===\n`));
}

function printSuccess(text: string) {
  console.log(chalk.green(`✓ ${text}`));
}

function printError(text: string) {
  console.log(chalk.red(`✗ ${text}`));
}

function printInfo(text: string) {
  console.log(chalk.blue(`ℹ ${text}`));
}

function printWarning(text: string) {
  console.log(chalk.yellow(`⚠ ${text}`));
}

// Функция для чтения SQL файла
const readSqlFile = (filename: string): string => {
  const filePath = path.join(SQL_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`File not found: ${filePath}`));
    return '';
  }
  
  return fs.readFileSync(filePath, 'utf8');
};

// Функция для создания директории для combined SQL
const ensureOutputDir = () => {
  const outputDir = path.join(process.cwd(), 'scripts', 'sql');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  return outputDir;
};

// Функция для генерации combined SQL
const generateCombinedSql = (): string => {
  const outputDir = ensureOutputDir();
  const outputPath = path.join(outputDir, 'combined.sql');
  
  // Заголовок SQL файла
  let combinedSql = `-- Combined SQL script generated on ${new Date().toISOString()}\n\n`;
  
  // Объединяем все SQL файлы
  for (const file of SQL_FILES) {
    const sqlContent = readSqlFile(file);
    
    if (sqlContent) {
      combinedSql += `-- ==========================================\n`;
      combinedSql += `-- Start of ${file}\n`;
      combinedSql += `-- ==========================================\n\n`;
      combinedSql += sqlContent;
      combinedSql += `\n\n`;
    }
  }
  
  // Сохраняем в файл
  fs.writeFileSync(outputPath, combinedSql);
  printSuccess(`Combined SQL saved to ${outputPath}`);
  
  return outputPath;
};

// Функция для настройки базы данных
async function setupDatabase() {
  printHeader('Настройка базы данных Supabase');
  
  console.log(chalk.blue('Объединяем SQL файлы...'));
  const combinedSqlPath = generateCombinedSql();

  const setupMethod = await select({
    message: 'Выберите способ настройки базы данных:',
    choices: [
      { name: 'Выполнить через Supabase CLI (требуется установленный CLI)', value: 'cli' },
      { name: 'Открыть SQL файл и выполнить вручную', value: 'manual' },
      { name: 'Пропустить настройку базы данных', value: 'skip' }
    ]
  });

  if (setupMethod === 'cli') {
    // Проверяем, настроено ли подключение к удаленному проекту Supabase
    printInfo('\nПроверяем подключение к удаленному проекту Supabase...');
    
    try {
      // Пробуем выполнить SQL в локальной базе данных
      printInfo('\nВыполняем команду: supabase db execute < ' + combinedSqlPath);
      await execCommand('sh', ['-c', `supabase db execute < ${combinedSqlPath}`]);
      
      // Локальное выполнение прошло успешно, но нужно проверить, отображаются ли таблицы в удаленном проекте
      printSuccess('\nSQL успешно выполнен в локальной базе данных.');
      printWarning('\nОднако, таблицы могут не появиться в вашем удаленном проекте Supabase.');
      
      const useRemote = await confirm({
        message: 'Хотите выполнить SQL также в удаленном проекте Supabase?',
        default: true
      });
      
      if (useRemote) {
        // Запрашиваем URL и ключ проекта, если они еще не настроены
        printInfo('\nДля выполнения SQL в удаленном проекте нужны данные для подключения.');
        printInfo('Эти данные можно найти в настройках вашего проекта на сайте Supabase.');
        
        const supabaseUrl = await input({
          message: 'Введите URL вашего проекта Supabase:',
          default: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        });
        
        const supabasePwd = await password({
          message: 'Введите пароль для пользователя postgres:',
          validate: (value) => {
            if (value.length < 1) {
              return 'Пароль не может быть пустым';
            }
            return true;
          }
        });
        
        // Извлекаем имя хоста и порт из URL
        const urlObj = new URL(supabaseUrl);
        const hostname = urlObj.hostname;
        
        // Выполняем команду psql для прямого подключения к базе данных
        printInfo('\nПодключаемся к удаленной базе данных...');
        
        try {
          // Пишем временный файл для хранения пароля
          const tmpPwdFile = path.join(process.cwd(), '.pgpass_tmp');
          fs.writeFileSync(tmpPwdFile, `${hostname}:5432:postgres:postgres:${supabasePwd}`);
          fs.chmodSync(tmpPwdFile, 0o600); // Устанавливаем права доступа
          
          // Выполняем SQL через psql
          await execCommand('sh', ['-c', `PGPASSFILE=${tmpPwdFile} psql -h ${hostname} -p 5432 -U postgres -d postgres -f ${combinedSqlPath}`]);
          
          // Удаляем временный файл пароля
          fs.unlinkSync(tmpPwdFile);
          
          printSuccess('\nSQL успешно выполнен в удаленном проекте Supabase!');
        } catch (remoteError) {
          printError('\nОшибка при выполнении SQL в удаленном проекте:');
          console.error(remoteError);
          
          printInfo('\nАльтернативный способ:');
          printInfo('1. Откройте SQL редактор в консоли Supabase: https://app.supabase.com');
          printInfo('2. Скопируйте содержимое файла SQL и выполните его вручную');
          printInfo(`3. Файл SQL: ${combinedSqlPath}`);
          
          const openSql = await confirm({
            message: 'Открыть SQL файл для копирования?',
            default: true
          });
          
          if (openSql) {
            await openSqlFileManually(combinedSqlPath);
          }
        }
      }
      
      return true;
    } catch (error) {
      printError('\nОшибка при выполнении SQL через CLI:');
      printError('Возможно Supabase CLI не установлен или не настроен');
      
      const tryManual = await confirm({
        message: 'Хотите открыть SQL файл и выполнить запросы вручную?',
        default: true
      });
      
      if (tryManual) {
        await openSqlFileManually(combinedSqlPath);
        return await confirmDatabaseSetup();
      } else {
        return false;
      }
    }
  } else if (setupMethod === 'manual') {
    await openSqlFileManually(combinedSqlPath);
    return await confirmDatabaseSetup();
  } else {
    printWarning('Настройка базы данных пропущена');
    return false;
  }
}

// Функция для открытия SQL файла вручную
async function openSqlFileManually(filePath: string) {
  printInfo('\nДля настройки базы данных:');
  printInfo('1. Войдите в консоль Supabase: https://app.supabase.com');
  printInfo('2. Выберите ваш проект и перейдите в раздел "SQL Editor"');
  printInfo('3. Скопируйте и выполните SQL из файла:');
  printInfo(`   ${filePath}`);
  
  // Попытка открыть файл в редакторе (может не работать на всех ОС)
  const tryOpen = await confirm({
    message: 'Открыть файл в текстовом редакторе (если доступно)?',
    default: true
  });
  
  if (tryOpen) {
    try {
      if (process.platform === 'darwin') {
        // macOS
        await execCommand('open', [filePath]);
      } else if (process.platform === 'win32') {
        // Windows
        await execCommand('notepad', [filePath]);
      } else {
        // Linux и другие
        await execCommand('xdg-open', [filePath]);
      }
    } catch (error) {
      printError('Не удалось открыть файл автоматически.');
      printInfo(`Путь к файлу: ${filePath}`);
    }
  }
}

// Функция для подтверждения настройки базы данных
async function confirmDatabaseSetup(): Promise<boolean> {
  const isSetupCompleted = await confirm({
    message: 'Вы выполнили SQL запросы в Supabase?',
    default: false
  });
  
  if (!isSetupCompleted) {
    printWarning('Необходимо выполнить SQL запросы для продолжения настройки');
    const retry = await confirm({
      message: 'Хотите продолжить без настройки базы данных?',
      default: false
    });
    
    if (!retry) {
      printInfo('Выход из программы настройки. Запустите снова после настройки базы данных.');
      process.exit(0);
    }
  }
  
  return isSetupCompleted;
}

// Набор предустановленных прав
const permissions = [
  { name: 'Список прав', slug: 'permissions.list' },
  { name: 'Управление правами', slug: 'permissions.manage' },
  { name: 'Список ролей', slug: 'roles.list' },
  { name: 'Управление ролями', slug: 'roles.manage' },
  { name: 'Список пользователей', slug: 'users.list' },
  { name: 'Управление пользователями', slug: 'users.manage' },
  { name: 'Доступ к админ-панели', slug: 'admin.access' }
];

// Набор предустановленных ролей
const roles = [
  { name: 'Администратор', code: 'admin', active: true },
  { name: 'Пользователь', code: 'user', active: true }
];

async function setupPermissions() {
  printHeader('Настройка прав доступа');
  
  for (const permission of permissions) {
    try {
      // Проверяем, существует ли уже такое право
      const { data: existingPerm, error: checkError } = await supabase
        .from('permissions')
        .select('id')
        .eq('slug', permission.slug)
        .maybeSingle();
      
      if (checkError) {
        if (checkError.message.includes('relation "permissions" does not exist')) {
          printError(`Таблица permissions не существует. База данных не настроена.`);
          return false;
        } else {
          throw checkError;
        }
      }
      
      if (existingPerm) {
        printInfo(`Право "${permission.name}" уже существует`);
        continue;
      }
      
      // Добавляем право
      const { error } = await supabase
        .from('permissions')
        .insert([permission]);
      
      if (error) throw error;
      
      printSuccess(`Добавлено право: ${permission.name} (${permission.slug})`);
    } catch (error: any) {
      printError(`Ошибка при добавлении права ${permission.slug}: ${error.message || error}`);
    }
  }
  
  return true;
}

async function setupRoles() {
  printHeader('Настройка ролей');
  
  for (const role of roles) {
    try {
      // Проверяем, существует ли уже такая роль
      const { data: existingRole, error: checkError } = await supabase
        .from('roles')
        .select('id')
        .eq('code', role.code)
        .maybeSingle();
      
      if (checkError) {
        if (checkError.message.includes('relation "roles" does not exist')) {
          printError(`Таблица roles не существует. База данных не настроена.`);
          return false;
        } else {
          throw checkError;
        }
      }
      
      if (existingRole) {
        printInfo(`Роль "${role.name}" уже существует`);
        continue;
      }
      
      // Добавляем роль
      const { error } = await supabase
        .from('roles')
        .insert([role]);
      
      if (error) throw error;
      
      printSuccess(`Добавлена роль: ${role.name} (${role.code})`);
    } catch (error: any) {
      printError(`Ошибка при добавлении роли ${role.code}: ${error.message || error}`);
    }
  }
  
  return true;
}

async function setupRolePermissions() {
  printHeader('Привязка прав к роли Администратор');
  
  try {
    // Получаем ID роли admin
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'admin')
      .single();
    
    if (roleError) {
      if (roleError.message.includes('relation "roles" does not exist')) {
        printError(`Таблица roles не существует. База данных не настроена.`);
        return false;
      } else {
        throw roleError;
      }
    }
    
    if (!adminRole) {
      printError('Роль "admin" не найдена');
      return false;
    }
    
    // Получаем все права
    const { data: allPermissions, error: permError } = await supabase
      .from('permissions')
      .select('id, name, slug');
    
    if (permError) {
      if (permError.message.includes('relation "permissions" does not exist')) {
        printError(`Таблица permissions не существует. База данных не настроена.`);
        return false;
      } else {
        throw permError;
      }
    }
    
    if (!allPermissions || allPermissions.length === 0) {
      printError('Права не найдены');
      return false;
    }
    
    // Проверяем, существует ли таблица roles_permissions
    const { error: checkError } = await supabase
      .from('roles_permissions')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.message.includes('relation "roles_permissions" does not exist')) {
      printError(`Таблица roles_permissions не существует. База данных не настроена.`);
      return false;
    }
    
    // Добавляем привязки прав к роли admin
    for (const permission of allPermissions) {
      // Проверяем, существует ли уже такая привязка
      const { data: existingBinding, error: checkBindingError } = await supabase
        .from('roles_permissions')
        .select('id')
        .eq('role_id', adminRole.id)
        .eq('permission_id', permission.id)
        .maybeSingle();
      
      if (checkBindingError) throw checkBindingError;
      
      if (existingBinding) {
        printInfo(`Привязка права "${permission.name}" к роли "Администратор" уже существует`);
        continue;
      }
      
      // Добавляем привязку
      const { error } = await supabase
        .from('roles_permissions')
        .insert([{
          role_id: adminRole.id,
          permission_id: permission.id
        }]);
      
      if (error) throw error;
      
      printSuccess(`Право "${permission.name}" привязано к роли "Администратор"`);
    }
    
    return true;
  } catch (error: any) {
    printError(`Ошибка при настройке привязок прав: ${error.message || error}`);
    return false;
  }
}

async function createAdminUser(email: string, pwd: string) {
  printHeader('Создание пользователя-администратора');
  
  try {
    // Проверяем, есть ли таблица users
    const { error: checkError } = await supabase.rpc('check_users_table_exists');
    
    if (checkError) {
      if (checkError.message.includes('function "check_users_table_exists" does not exist')) {
        // Проверяем, существуют ли необходимые таблицы
        printWarning('Функция проверки таблицы пользователей недоступна');
        
        const { error: usersCheckError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
          
        if (usersCheckError && usersCheckError.message.includes('relation "users" does not exist')) {
          printWarning('Таблица users не существует. База данных не настроена полностью.');
          printWarning('Создаем пользователя только в Auth');
          
          // Создаем пользователя через Auth API
          const { data: authUser, error: authError } = await supabase.auth.signUp({
            email,
            password: pwd,
            options: {
              data: {
                role: 'admin'
              }
            }
          });
          
          if (authError) throw authError;
          
          printSuccess(`Пользователь создан через Auth API`);
          return true;
        }
      } else {
        throw checkError;
      }
    }
    
    // Получаем ID роли admin
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'admin')
      .single();
    
    if (roleError) {
      if (roleError.message.includes('relation "roles" does not exist')) {
        printError(`Таблица roles не существует. База данных не настроена.`);
        return false;
      } else {
        throw roleError;
      }
    }
    
    // Проверяем, существует ли уже пользователь с таким email
    const { data: existingUser, error: checkUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (checkUserError && !checkUserError.message.includes('relation "users" does not exist')) {
      throw checkUserError;
    }
    
    if (existingUser) {
      printInfo(`Пользователь с email ${email} уже существует`);
      return true;
    }
    
    // Создаем пользователя
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password: pwd
    });
    
    if (authError) throw authError;
    
    if (!authUser.user) {
      throw new Error('Не удалось создать пользователя в Auth');
    }
    
    // Добавляем запись в таблицу users (если она существует)
    if (!checkError) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: authUser.user.id,
          email,
          role_id: adminRole.id
        }]);
      
      if (insertError && !insertError.message.includes('relation "users" does not exist')) {
        throw insertError;
      }
    }
    
    printSuccess(`Пользователь успешно создан`);
    return true;
  } catch (error: any) {
    printError(`Ошибка при создании пользователя: ${error.message || error}`);
    return false;
  }
}

async function main() {
  console.clear();
  printHeader('Настройка Supabase и создание администратора');
  
  try {
    // Сначала настраиваем базу данных
    const databaseAction = await select({
      message: 'Что вы хотите сделать?',
      choices: [
        { name: 'Настроить базу данных и создать администратора', value: 'all' },
        { name: 'Только настроить базу данных', value: 'db-only' },
        { name: 'Только создать администратора (если БД уже настроена)', value: 'admin-only' }
      ]
    });
    
    let dbSetup = false;
    
    if (databaseAction === 'all' || databaseAction === 'db-only') {
      dbSetup = await setupDatabase();
      
      if (!dbSetup && databaseAction === 'all') {
        const continueAnyway = await confirm({
          message: 'Настройка базы данных не завершена. Продолжить настройку администратора?',
          default: false
        });
        
        if (!continueAnyway) {
          printInfo('Процесс настройки прерван. Запустите снова после настройки базы данных.');
          process.exit(0);
        }
      }
      
      if (databaseAction === 'db-only') {
        printSuccess('Настройка базы данных завершена!');
        process.exit(0);
      }
    }
    
    // Запрашиваем данные пользователя с валидацией
    const email = await input({
      message: 'Введите Email администратора:',
      validate: (value) => {
        if (!value.includes('@') || !value.includes('.')) {
          return 'Некорректный формат Email';
        }
        return true;
      }
    });
    
    const pwd = await password({
      message: 'Введите пароль:',
      validate: (value) => {
        if (value.length < 6) {
          return 'Пароль должен содержать не менее 6 символов';
        }
        return true;
      }
    });
    
    const confirmPwd = await password({
      message: 'Подтвердите пароль:',
      validate: (value) => {
        if (value !== pwd) {
          return 'Пароли не совпадают';
        }
        return true;
      }
    });
    
    console.log(chalk.dim('\nНачинаем настройку...\n'));
    
    // Последовательно выполняем настройку
    const permissionsOk = await setupPermissions();
    const rolesOk = await setupRoles();
    const rolePermissionsOk = await setupRolePermissions();
    
    if (!permissionsOk || !rolesOk || !rolePermissionsOk) {
      printWarning('\nНекоторые шаги настройки не удалось выполнить. Возможно, база данных не полностью настроена.');
      
      const continueAnyway = await confirm({
        message: 'Продолжить создание администратора?',
        default: true
      });
      
      if (!continueAnyway) {
        printInfo('Процесс настройки прерван. Запустите снова после настройки базы данных.');
        process.exit(0);
      }
    }
    
    const userOk = await createAdminUser(email, pwd);
    
    printHeader('Настройка завершена');
    
    if (userOk) {
      printSuccess('Пользователь успешно создан.');
      printInfo(`Email: ${email}`);
      printInfo(`Пароль: ${chalk.dim('*'.repeat(pwd.length))}`);
      
      // Информация о дальнейших шагах
      console.log(chalk.bold('\nДальнейшие действия:'));
      console.log(chalk.dim('1. Запустите приложение: bun run dev'));
      console.log(chalk.dim('2. Перейдите на http://localhost:3000/supabase'));
      console.log(chalk.dim('3. Войдите в систему, используя созданные учетные данные'));
    } else {
      printWarning('Настройка администратора не была полностью завершена.');
      printInfo('Возможно, требуется сначала настроить базу данных.');
    }
    
  } catch (error: any) {
    printError(`Произошла ошибка: ${error.message || error}`);
  }
}

// Запускаем основную функцию
main(); 