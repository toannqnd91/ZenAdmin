/**
 * File Utilities
 */

import * as fs from 'fs'
import * as path from 'path'

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  ensureDirectoryExists(dir)
  fs.writeFileSync(filePath, content, 'utf-8')
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

export function listFiles(dirPath: string, extension?: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return []
  }
  
  const files = fs.readdirSync(dirPath)
  
  if (extension) {
    return files.filter(f => f.endsWith(extension))
  }
  
  return files
}

export function copyFile(source: string, destination: string): void {
  const dir = path.dirname(destination)
  ensureDirectoryExists(dir)
  fs.copyFileSync(source, destination)
}

export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to)
}

export function joinPaths(...paths: string[]): string {
  return path.join(...paths)
}

export function getFileName(filePath: string): string {
  return path.basename(filePath)
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath)
}

export function getFileNameWithoutExtension(filePath: string): string {
  const ext = path.extname(filePath)
  const base = path.basename(filePath)
  return base.slice(0, base.length - ext.length)
}
