import { IsArray, ArrayMinSize, IsMongoId } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsMongoId({ each: true })
  participants!: string[];  // Array of User IDs, minimum 2 participants
}
