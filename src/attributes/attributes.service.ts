import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { Attribute } from './entities/attribute.entity';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute)
    private attributeRepository: Repository<Attribute>,
  ) {}

  async create(createAttributeDto: CreateAttributeDto): Promise<Attribute> {
    const attribute = this.attributeRepository.create(createAttributeDto);
    return await this.attributeRepository.save(attribute);
  }

  async findAll(): Promise<Attribute[]> {
    return await this.attributeRepository.find({
      relations: ['products'],
    });
  }

  async findOne(id: number): Promise<Attribute> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!attribute) {
      throw new Error(`Attribute with id ${id} not found`);
    }
    return attribute;
  }

  async update(
    id: number,
    updateAttributeDto: UpdateAttributeDto,
  ): Promise<Attribute> {
    await this.attributeRepository.update(id, updateAttributeDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.attributeRepository.delete(id);
  }

  async findByIds(ids: number[]): Promise<Attribute[]> {
    return await this.attributeRepository.findByIds(ids);
  }
}
